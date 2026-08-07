FROM terrestris/tomcat:8.5.37@sha256:d6690234734e4dbbff3f90a68f30c5158d236ba47fdf19e4f67b2a94f16de8fb

ARG MAPFISH2_VERSION

RUN apk -U upgrade --update && \
    apk add curl && \
    rm -rf $CATALINA_HOME/webapps/*

RUN curl -jkSL -o /tmp/print.war \
    https://repo.maven.apache.org/maven2/org/mapfish/print/print-servlet/$MAPFISH2_VERSION/print-servlet-$MAPFISH2_VERSION.war && \
    mkdir $CATALINA_HOME/webapps/print && \
    unzip -q /tmp/print.war -d $CATALINA_HOME/webapps/print && \
    rm /tmp/print.war

RUN apk del curl && \
    rm -rf /tmp/* /var/cache/apk/*
